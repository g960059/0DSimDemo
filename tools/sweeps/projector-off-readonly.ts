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

type Mode = "projector-on" | "init-only" | "global-only";

function pack(core: any) {
  return core.computePressures(core.x);
}

function flows(core: any, p: any) {
  return core.computeFlows(core.x, p);
}

function groupVolumes(p: any) {
  const v = p.Vphys as Float64Array;
  return {
    pv: v[ni.PCap] + v[ni.PVen] + v[ni.PVein],
    sysV: v[ni.SV] + v[ni.VC],
    total: Array.from(v).reduce((a, b) => a + b, 0),
    V: new Float64Array(v),
  };
}

function makeCore(tbv: number, mode: Mode) {
  const core = new ModelCore(defaultParams());
  core.initializeVenousPressuresForTargetTBV(tbv);
  if (mode === "init-only") core.setImmediateParameters({ projectTBV: false });
  return core as any;
}

function run(tbv: number, mode: Mode) {
  const dt = Number(process.env.DT ?? 0.001);
  const checkpoints = [60, 120, 180, 240, 300];
  const beatSec = 60 / defaultParams().HR;
  const windowSec = beatSec * 5;
  const core = makeCore(tbv, mode);
  const rows: any[] = [];
  const recent: any[] = [];
  const beats: any[] = [];
  let lastPhi = core.sample().phi;
  let next = 0;

  while (core.t < checkpoints.at(-1)! - 1e-12) {
    core.step(dt);
    const s = core.sample();
    const pp = pack(core);
    const ff = flows(core, pp);
    const gv = groupVolumes(pp);
    const phiFloor = Math.floor(s.phi);
    if (phiFloor > Math.floor(lastPhi)) {
      beats.push({ t: core.t, ...gv });
      if (beats.length > 20) beats.shift();
    }
    lastPhi = s.phi;
    recent.push({
      t: core.t,
      AoP: s.AoP, PAP: s.PAP, LAP: s.LAP, RAP: s.RAP,
      QAo: s.QAo, QPA: s.QPA,
      VLA: s.VLA, VRA: s.VRA,
      qInPV: ff[ei.PArt_PCap], qOutPV: ff[ei.PVein_LA],
      qInSysV: ff[ei.Cap_SV], qOutSysV: ff[ei.VC_RA],
    });
    if (recent.length > Math.ceil(windowSec / dt) + 8) recent.shift();

    if (core.t + 1e-12 < checkpoints[next]) continue;
    const end = checkpoints[next];
    const data = recent.filter((r) => r.t >= end - windowSec - 1e-9 && r.t <= end + 1e-9);
    let areaAo = 0, areaPA = 0, areaPV = 0, areaSysV = 0;
    let sumAoP = 0, sumPAP = 0, sumLAP = 0, sumRAP = 0;
    for (let i = 1; i < data.length; i++) {
      const a = data[i - 1], b = data[i];
      const d = b.t - a.t;
      areaAo += 0.5 * d * (Math.max(0, a.QAo) + Math.max(0, b.QAo));
      areaPA += 0.5 * d * (Math.max(0, a.QPA) + Math.max(0, b.QPA));
      areaPV += 0.5 * d * ((a.qInPV - a.qOutPV) + (b.qInPV - b.qOutPV));
      areaSysV += 0.5 * d * ((a.qInSysV - a.qOutSysV) + (b.qInSysV - b.qOutSysV));
      sumAoP += b.AoP; sumPAP += b.PAP; sumLAP += b.LAP; sumRAP += b.RAP;
    }
    const w = data.at(-1)!.t - data[0]!.t;
    const lastBeat = beats.at(-1);
    const prevBeat = beats.at(-2);
    const maxNodeBeatDrift = lastBeat && prevBeat
      ? Math.max(...Array.from(lastBeat.V as Float64Array).map((v, i) => Math.abs(v - prevBeat.V[i])))
      : NaN;
    const obs = core.debugObservables();
    const status = core.assessSteadyState({
      ...DEFAULT_SETTLE_POLICY,
      tolPrimary: 1e-4,
      tolShape: 2e-4,
      capSeconds: 300,
    });
    const vlaMax = Math.max(...data.map((r) => r.VLA));
    const vlaMin = Math.min(...data.map((r) => r.VLA));
    const vraMax = Math.max(...data.map((r) => r.VRA));
    const vraMin = Math.min(...data.map((r) => r.VRA));
    const pvDelta = lastBeat && prevBeat ? lastBeat.pv - prevBeat.pv : NaN;
    const sysVDelta = lastBeat && prevBeat ? lastBeat.sysV - prevBeat.sysV : NaN;
    const totalDelta = lastBeat && prevBeat ? lastBeat.total - prevBeat.total : NaN;
    rows.push({
      tbv, mode, sec: end,
      strictSettled: maxNodeBeatDrift <= 0.05 && Math.abs(totalDelta) <= 0.05,
      detectorSettled: status.settled,
      detectorReason: status.reason,
      worstSignal: status.worstSignal,
      worstDelta: status.worstDelta,
      CO_L: (areaAo / w) * 60 / 1000,
      CO_R: (areaPA / w) * 60 / 1000,
      LAP: sumLAP / Math.max(data.length - 1, 1),
      RAP: sumRAP / Math.max(data.length - 1, 1),
      AoP: sumAoP / Math.max(data.length - 1, 1),
      PAP: sumPAP / Math.max(data.length - 1, 1),
      VLAmax: vlaMax,
      VLAmin: vlaMin,
      LAEF: (vlaMax - vlaMin) / Math.max(vlaMax, 1e-9),
      VRAmax: vraMax,
      VRAmin: vraMin,
      RAEF: (vraMax - vraMin) / Math.max(vraMax, 1e-9),
      pulmonaryVenousVolume: obs.pulmonaryVenousVolume,
      pVeinVcGradient: obs.pVeinVcGradient,
      P_PVein: obs.P_PVein,
      P_VC: obs.P_VC,
      pvDeltaBeat: pvDelta,
      sysVDeltaBeat: sysVDelta,
      totalDeltaBeat: totalDelta,
      maxNodeBeatDrift,
      projectorPVPerBeat: pvDelta - areaPV * (beatSec / w),
      projectorSysVPerBeat: sysVDelta - areaSysV * (beatSec / w),
      health: core.health(),
    });
    next++;
    if (next >= checkpoints.length) break;
  }
  return rows;
}

for (const mode of ["projector-on", "init-only", "global-only"] as const) {
  for (const tbv of [4800, 5600, 6200]) {
    for (const r of run(tbv, mode)) {
      console.log(JSON.stringify({
        tbv: r.tbv, mode: r.mode, sec: r.sec,
        strictSettled: r.strictSettled,
        detector: [r.detectorSettled, r.detectorReason, r.worstSignal, Number(r.worstDelta.toExponential(3))],
        CO: [r.CO_L, r.CO_R, Math.abs(r.CO_L - r.CO_R)].map((x) => Number(x.toFixed(3))),
        LAP: Number(r.LAP.toFixed(3)), RAP: Number(r.RAP.toFixed(3)),
        grad: Number((r.LAP - r.RAP).toFixed(3)),
        AoP: Number(r.AoP.toFixed(2)), PAP: Number(r.PAP.toFixed(2)),
        LA: [r.VLAmax, r.VLAmin, r.LAEF].map((x) => Number(x.toFixed(3))),
        RA: [r.VRAmax, r.VRAmin, r.RAEF].map((x) => Number(x.toFixed(3))),
        PVvol: Number(r.pulmonaryVenousVolume.toFixed(3)),
        PVeinVC: [r.P_PVein, r.P_VC, r.pVeinVcGradient].map((x) => Number(x.toFixed(3))),
        driftBeat: [r.pvDeltaBeat, r.sysVDeltaBeat, r.totalDeltaBeat, r.maxNodeBeatDrift].map((x) => Number(x.toFixed(5))),
        residualBeat: [r.projectorPVPerBeat, r.projectorSysVPerBeat].map((x) => Number(x.toFixed(5))),
        health: {
          status: r.health.status,
          tbvDriftMl: Number(r.health.tbvDriftMl.toFixed(3)),
          flowMismatch: Number(r.health.leftRightFlowMismatchLMin.toFixed(3)),
          clamps: r.health.clampHitCount,
        },
      }));
    }
  }
}
