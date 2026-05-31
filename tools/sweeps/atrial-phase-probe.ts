import { ModelCore, defaultParams } from "@/engine/ModelCore";
import { DEFAULT_SETTLE_POLICY } from "@/engine/settling";

console.warn = () => {};

function makeParams() {
  const p: any = defaultParams();
  if (process.env.CANDIDATE === "c4.8") {
    p.nodeOverrides = {
      PCap: { Ccoll: 2.4, Copen: 4.8, Cdist: 2.4 },
      PVen: { Ccoll: 2.4, Copen: 4.8, Cdist: 2.4 },
      PVein: { Ccoll: 2.4, Copen: 4.8, Cdist: 2.4 },
    };
  }
  const activeFor = (side: "LA" | "RA") => {
    const active: Record<string, number> = {};
    for (const [suffix, key] of [
      ["LEAD", "atrialLeadSec"],
      ["AREL", "Arel0"],
      ["TAUCA", "tauCa0"],
      ["TREL", "Trel0"],
      ["TMAX", "Tmax0"],
    ] as const) {
      const sideEnv = `${side}_${suffix}`;
      const sharedEnv = suffix === "LEAD" ? "ATRIAL_LEAD" : `LA_${suffix}`;
      if (process.env[sideEnv]) active[key] = Number(process.env[sideEnv]);
      else if (process.env[sharedEnv]) active[key] = Number(process.env[sharedEnv]);
    }
    return active;
  };
  const laActive = activeFor("LA");
  const raActive = activeFor("RA");
  if (Object.keys(laActive).length > 0 || Object.keys(raActive).length > 0) {
    p.nodeOverrides = {
      ...(p.nodeOverrides ?? {}),
      ...(Object.keys(laActive).length > 0 ? { LA: { active: laActive } } : {}),
      ...(Object.keys(raActive).length > 0 ? { RA: { active: raActive } } : {}),
    };
  }
  if (process.env.PVEIN_LA_R) {
    p.edgeOverrides = {
      ...(p.edgeOverrides ?? {}),
      PVein_LA: { R: Number(process.env.PVEIN_LA_R) },
    };
  }
  return p;
}

type Row = ReturnType<ModelCore["sample"]>;

function frac(x: number) {
  return x - Math.floor(x);
}

function phaseDiffMs(aTheta: number, refTheta: number, beatMs: number) {
  let d = refTheta - aTheta;
  if (d < -0.5) d += 1;
  if (d > 0.5) d -= 1;
  return d * beatMs;
}

function maxBy<T>(xs: T[], f: (x: T, i: number) => number) {
  let best = xs[0], bestV = -Infinity, bestI = 0;
  xs.forEach((x, i) => {
    const v = f(x, i);
    if (v > bestV) { best = x; bestV = v; bestI = i; }
  });
  return { item: best, value: bestV, index: bestI };
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

function localAtrialBump(rows: Row[], key: "LAP" | "RAP") {
  const pressures = smooth(rows.map((r) => Number(r[key])));
  const lateIndexes = rows
    .map((r, i) => ({ theta: frac(r.phi), i }))
    .filter(({ theta, i }) => theta >= 0.80 && theta < 0.995 && i > 0 && i < rows.length - 1);
  const fallback = maxBy(lateIndexes, ({ i }) => Number(rows[i][key]));
  let best: { index: number; prominence: number } | null = null;
  for (const { i, theta } of lateIndexes) {
    if (!(pressures[i - 1] < pressures[i] && pressures[i] >= pressures[i + 1])) continue;
    const left = lateIndexes.filter((x) => x.theta >= Math.max(0.80, theta - 0.18) && x.i <= i);
    const right = lateIndexes.filter((x) => x.i >= i && x.theta <= Math.min(0.995, theta + 0.12));
    const leftMin = Math.min(...left.map((x) => pressures[x.i]));
    const rightMin = Math.min(...right.map((x) => pressures[x.i]));
    const prominence = pressures[i] - Math.max(leftMin, rightMin);
    if (prominence < 0.05) continue;
    if (!best || prominence > best.prominence) best = { index: i, prominence };
  }
  if (best) {
    return {
      row: rows[best.index],
      local: true,
      prominence: best.prominence,
    };
  }
  return {
    row: rows[fallback.item.i],
    local: false,
    prominence: 0,
  };
}

function crossing(rows: Row[], key: "QMV" | "QTV") {
  for (let i = 1; i < rows.length; i++) {
    if (rows[i - 1][key] > 0 && rows[i][key] <= 0) return rows[i];
  }
  return null;
}

function phaseMetrics(params = makeParams()) {
  const tbv = Number(process.env.TBV ?? 5600);
  const dt = Number(process.env.DT ?? 0.0005);
  const sampleHz = Number(process.env.SAMPLE_HZ ?? 2000);
  const core = new ModelCore(params);
  core.initializeVenousPressuresForTargetTBV(tbv);
  const status = core.settleToSteady({ ...DEFAULT_SETTLE_POLICY, capSeconds: 180 }, dt, sampleHz);
  if (!status.settled) throw new Error(`not settled ${JSON.stringify(status)}`);
  const startBeat = Math.floor(core.sample().phi);
  while (Math.floor(core.sample().phi) === startBeat) core.runFor(Math.min(0.005, dt * 10), dt, sampleHz);
  const beat = Math.floor(core.sample().phi);
  const rows: Row[] = [];
  while (Math.floor(core.sample().phi) === beat) {
    rows.push(core.sample());
    core.runFor(1 / sampleHz, dt, sampleHz);
  }
  rows.push(core.sample());
  const beatMs = 60000 / core.p.HR;
  const laBump = localAtrialBump(rows, "LAP");
  const raBump = localAtrialBump(rows, "RAP");
  const laPeak = laBump.row;
  const raPeak = raBump.row;
  const lvpRise = maxBy(rows.slice(1), (r, i) => {
    const a = rows[i], b = r;
    return (b.LVP - a.LVP) / Math.max(b.t - a.t, 1e-9);
  }).item;
  const rvpRise = maxBy(rows.slice(1), (r, i) => {
    const a = rows[i], b = r;
    return (b.RVP - a.RVP) / Math.max(b.t - a.t, 1e-9);
  }).item;
  const mvClose = crossing(rows, "QMV") ?? lvpRise;
  const tvClose = crossing(rows, "QTV") ?? rvpRise;
  const out = {
    candidate: process.env.CANDIDATE ?? "current",
    overrides: {
      atrialLeadSec: process.env.ATRIAL_LEAD ? Number(process.env.ATRIAL_LEAD) : 0.16,
      LA: {
        lead: process.env.LA_LEAD ? Number(process.env.LA_LEAD) : process.env.ATRIAL_LEAD ? Number(process.env.ATRIAL_LEAD) : 0.16,
        Arel0: process.env.LA_AREL ? Number(process.env.LA_AREL) : 0.04,
        tauCa0: process.env.LA_TAUCA ? Number(process.env.LA_TAUCA) : 0.08,
        Trel0: process.env.LA_TREL ? Number(process.env.LA_TREL) : 0.09,
        Tmax0: process.env.LA_TMAX ? Number(process.env.LA_TMAX) : 3000,
      },
      RA: {
        lead: process.env.RA_LEAD ? Number(process.env.RA_LEAD) : process.env.ATRIAL_LEAD ? Number(process.env.ATRIAL_LEAD) : 0.16,
        Arel0: process.env.RA_AREL ? Number(process.env.RA_AREL) : 0.10,
        tauCa0: process.env.RA_TAUCA ? Number(process.env.RA_TAUCA) : 0.08,
        Trel0: process.env.RA_TREL ? Number(process.env.RA_TREL) : 0.09,
        Tmax0: process.env.RA_TMAX ? Number(process.env.RA_TMAX) : 8000,
      },
    },
    settleSeconds: status.actualSeconds,
    LA: {
      aTheta: frac(laPeak.phi),
      aPressure: laPeak.LAP,
      local: laBump.local,
      prominence: laBump.prominence,
      lvpRiseTheta: frac(lvpRise.phi),
      mvCloseTheta: frac(mvClose.phi),
      leadToLvpRiseMs: phaseDiffMs(frac(laPeak.phi), frac(lvpRise.phi), beatMs),
      leadToMvCloseMs: phaseDiffMs(frac(laPeak.phi), frac(mvClose.phi), beatMs),
    },
    RA: {
      aTheta: frac(raPeak.phi),
      aPressure: raPeak.RAP,
      local: raBump.local,
      prominence: raBump.prominence,
      rvpRiseTheta: frac(rvpRise.phi),
      tvCloseTheta: frac(tvClose.phi),
      leadToRvpRiseMs: phaseDiffMs(frac(raPeak.phi), frac(rvpRise.phi), beatMs),
      leadToTvCloseMs: phaseDiffMs(frac(raPeak.phi), frac(tvClose.phi), beatMs),
    },
  };
  console.log(JSON.stringify(out, (_k, v) => typeof v === "number" ? Number(v.toFixed(4)) : v));
}

phaseMetrics();
