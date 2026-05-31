import { defaultParams } from "@/engine/ModelCore";
import { settleToSteadyState } from "@/engine/measure";
import { DEFAULT_SETTLE_POLICY } from "@/engine/settling";

console.warn = () => {};

type Mode = "off" | "on" | "cooldown-off";

function trap(dt: number, a: number, b: number) {
  return 0.5 * dt * (a + b);
}

function align(core: any, dt: number, sampleHz: number) {
  const beat = Math.floor(core.sample().phi);
  while (Math.floor(core.sample().phi) === beat) core.runFor(Math.min(0.01, dt * 10), dt, sampleHz);
}

function measure(mode: Mode, tbv: number) {
  const dt = Number(process.env.DT ?? 0.001);
  const sampleHz = Number(process.env.SAMPLE_HZ ?? 240);
  const measureBeats = Number(process.env.BEATS ?? 1);
  const cooldownBeats = Number(process.env.COOLDOWN_BEATS ?? 0);
  const settled = settleToSteadyState(paramsForCandidate(process.env.CANDIDATE ?? "current"), {
    targetTBV: tbv,
    dt,
    sampleHz,
    settlePolicy: { ...DEFAULT_SETTLE_POLICY, capSeconds: Number(process.env.CAP ?? 120) },
    requireProjectorQuiet: false,
  });
  if (!settled.ok) throw new Error(`not settled: ${JSON.stringify(settled.settleStatus)}`);
  const core: any = settled.core;
  align(core, dt, sampleHz);
  if (mode === "off" || mode === "cooldown-off") core.setTBVCorrectionEnabled(false);
  if (mode === "cooldown-off" && cooldownBeats > 0) {
    core.runFor(cooldownBeats * 60 / core.p.HR, dt, sampleHz);
    align(core, dt, sampleHz);
  }
  core.resetTBVCorrectionCounters();
  const start = core.debugVenousGroupBalances();
  const samples = [core.sample(), ...core.runFor(measureBeats * 60 / core.p.HR, dt, sampleHz)];
  const end = core.debugVenousGroupBalances();
  let sysNet = 0, pvNet = 0, netAo = 0, netPa = 0;
  let sumLAP = 0, sumRAP = 0;
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1], b = samples[i], d = b.t - a.t;
    sysNet += trap(d, a.QCapSV - a.SVF, b.QCapSV - b.SVF);
    pvNet += trap(d, a.QPArtPCap - a.PVF, b.QPArtPCap - b.PVF);
    netAo += trap(d, a.QAo, b.QAo);
    netPa += trap(d, a.QPA, b.QPA);
    sumLAP += b.LAP;
    sumRAP += b.RAP;
  }
  const duration = samples.at(-1)!.t - samples[0].t;
  const sysResidual = (end.systemicVenous.volume - start.systemicVenous.volume) - sysNet;
  const pvResidual = (end.pulmonaryVenous.volume - start.pulmonaryVenous.volume) - pvNet;
  const obs = core.debugObservables();
  return {
    mode,
    tbv,
    settleSeconds: settled.settleStatus.actualSeconds,
    correctionEnabled: mode === "on",
    tbvStart: start.totalBloodVolume,
    tbvEnd: end.totalBloodVolume,
    tbvDrift: end.totalBloodVolume - start.totalBloodVolume,
    tbvError: end.tbvErrorMl,
    correctionPerBeat: end.tbvCorrectionMagPerBeat,
    correctionLastStep: end.tbvCorrectionLastStepMl,
    sysResidual,
    pvResidual,
    maxResidual: Math.max(Math.abs(sysResidual), Math.abs(pvResidual)),
    netCO_L: netAo * 60 / (1000 * duration),
    netCO_R: netPa * 60 / (1000 * duration),
    LAP: sumLAP / Math.max(samples.length - 1, 1),
    RAP: sumRAP / Math.max(samples.length - 1, 1),
    LA: [Math.max(...samples.map((s) => s.VLA)), Math.min(...samples.map((s) => s.VLA))],
    RA: [Math.max(...samples.map((s) => s.VRA)), Math.min(...samples.map((s) => s.VRA))],
    P: [obs.P_PVein, obs.P_VC, obs.pVeinVcGradient],
    pvVol: obs.pulmonaryVenousVolume,
    health: core.health(),
  };
}

function paramsForCandidate(name: string) {
  const p: any = defaultParams();
  if (name === "current") return p;
  const c = Number(name.replace(/^c/, ""));
  if (Number.isFinite(c) && c > 0) {
    p.nodeOverrides = {
      PCap: { Ccoll: Math.max(2, c * 0.5), Copen: c, Cdist: Math.max(2, c * 0.5) },
      PVen: { Ccoll: Math.max(2, c * 0.5), Copen: c, Cdist: Math.max(2, c * 0.5) },
      PVein: { Ccoll: Math.max(2, c * 0.5), Copen: c, Cdist: Math.max(2, c * 0.5) },
    };
  }
  if (process.env.LA_SIGMA) {
    p.nodeOverrides = {
      ...(p.nodeOverrides ?? {}),
      LA: { active: { ...(p.nodeOverrides?.LA?.active ?? {}), sigmaPas0: Number(process.env.LA_SIGMA) } },
    };
  }
  const activeOverride = (side: "LA" | "RA") => {
    const active: Record<string, number> = {};
    for (const [suffix, key] of [
      ["LEAD", "atrialLeadSec"],
      ["AREL", "Arel0"],
      ["TAUCA", "tauCa0"],
      ["TREL", "Trel0"],
      ["TMAX", "Tmax0"],
    ] as const) {
      const env = `${side}_${suffix}`;
      if (process.env[env]) active[key] = Number(process.env[env]);
    }
    if (Object.keys(active).length === 0) return;
    p.nodeOverrides = {
      ...(p.nodeOverrides ?? {}),
      [side]: { active: { ...(p.nodeOverrides?.[side]?.active ?? {}), ...active } },
    };
  };
  activeOverride("LA");
  activeOverride("RA");
  if (process.env.RA_SIGMA || process.env.RA_B || process.env.RA_VREF) {
    p.nodeOverrides = {
      ...(p.nodeOverrides ?? {}),
      RA: {
        active: {
          ...(process.env.RA_SIGMA ? { sigmaPas0: Number(process.env.RA_SIGMA) } : {}),
          ...(process.env.RA_B ? { bPas: Number(process.env.RA_B) } : {}),
          ...(process.env.RA_VREF ? { Vref: Number(process.env.RA_VREF) } : {}),
        },
      },
    };
  }
  if (process.env.VC_RA_R) {
    p.edgeOverrides = {
      ...(p.edgeOverrides ?? {}),
      VC_RA: { R: Number(process.env.VC_RA_R) },
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

const modes = (process.env.MODES ?? "off,on,cooldown-off").split(",") as Mode[];
for (const mode of modes) {
  for (const tbv of (process.env.TBVS ?? "6200").split(",").map(Number)) {
    const r = measure(mode, tbv);
    console.log(JSON.stringify({
      mode: r.mode,
      candidate: process.env.CANDIDATE ?? "current",
      targetTBV: r.tbv,
      settle: Number(r.settleSeconds.toFixed(3)),
      tbv: [r.tbvStart, r.tbvEnd, r.tbvDrift, r.tbvError].map((x) => Number(x.toFixed(4))),
      residual: [r.sysResidual, r.pvResidual, r.maxResidual].map((x) => Number(x.toFixed(4))),
      correction: [r.correctionPerBeat, r.correctionLastStep].map((x) => Number(x.toFixed(5))),
      netCO: [r.netCO_L, r.netCO_R, Math.abs(r.netCO_L - r.netCO_R)].map((x) => Number(x.toFixed(4))),
      grad: [r.LAP, r.RAP, r.LAP - r.RAP].map((x) => Number(x.toFixed(3))),
      LA: r.LA.map((x) => Number(x.toFixed(3))),
      RA: r.RA.map((x) => Number(x.toFixed(3))),
      PVeinVC: r.P.map((x) => Number(x.toFixed(3))),
      pvVol: Number(r.pvVol.toFixed(3)),
      health: [r.health.status, Number(r.health.tbvDriftMl.toFixed(4)), r.health.clampHitCount],
    }));
  }
}
