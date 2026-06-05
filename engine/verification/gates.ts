import type { ModelCore } from "@/engine/ModelCore";
import type { SteadyMeasurement } from "@/engine/measure";
import type { SimSample } from "@/engine/protocol";
import type { SettleStatus } from "@/engine/settling";
import {
  atrialLoopShape,
  atrioventricularInflowShape,
  elastanceShape,
  lastCompleteBeat,
  meanOf,
  phaseInWindow,
  phaseOf,
  preSystolicRvEdp,
  pulmonaryVenousShape,
  rangeOf,
  regurgitantFraction,
  transmitralGradientStats,
} from "@/engine/verification/shapeMetrics";

export type GateSeverity = "hard" | "soft";
export type GateStatus = "pass" | "fail";

export type GateResult = {
  id: string;
  label: string;
  severity: GateSeverity;
  status: GateStatus;
  value?: number | string | boolean | null;
  threshold?: string;
  score?: number;
  message: string;
};

export type VerificationSummary = {
  pass: boolean;
  hardFailures: number;
  softFailures: number;
  score: number;
};

export type BaselineShapeSummary = {
  lvpPeak: number;
  aopPeak: number;
  lvpAopPeakGap: number;
  lvpMin: number;
  qmvAOverE: number | null;
  qtvAOverE: number | null;
  pvfSFraction: number | null;
  pvfSOverD: number | null;
  pvfReverseFraction: number | null;
  laSelfIntersections: number;
  raSelfIntersections: number;
  lvActiveElastanceHalfMaxSec: number;
  rvPreSystolicEdp: number;
};

export function summarizeGates(gates: GateResult[]): VerificationSummary {
  const hardFailures = gates.filter((g) => g.severity === "hard" && g.status === "fail").length;
  const softFailures = gates.filter((g) => g.severity === "soft" && g.status === "fail").length;
  const scored = gates.filter((g) => typeof g.score === "number");
  const score = scored.length > 0
    ? scored.reduce((acc, gate) => acc + Number(gate.score), 0) / scored.length
    : hardFailures === 0 ? 1 : 0;
  return {
    pass: hardFailures === 0,
    hardFailures,
    softFailures,
    score,
  };
}

export function settleGate(status: SettleStatus | null | undefined): GateResult {
  const pass = Boolean(status?.settled);
  return {
    id: "settled",
    label: "Converged to a periodic steady state",
    severity: "hard",
    status: pass ? "pass" : "fail",
    value: status ? `${status.reason}; beats=${status.beats}; worst=${status.worstSignal ?? "none"}; delta=${status.worstDelta}` : null,
    threshold: "settled === true",
    message: pass ? "Limit-cycle convergence reached." : "Candidate did not reach the required steady state.",
  };
}

export function collectValidityGates(measurement: SteadyMeasurement): GateResult[] {
  const finite = measurement.samples.every((sample) => {
    return Object.entries(sample).every(([, value]) => typeof value !== "number" || Number.isFinite(value));
  });
  return [
    {
      id: "finite-samples",
      label: "Finite observable samples",
      severity: "hard",
      status: finite ? "pass" : "fail",
      value: finite,
      threshold: "all numeric sample fields finite",
      message: finite ? "All recorded observables are finite." : "At least one recorded observable is non-finite.",
    },
    {
      id: "health-not-failed",
      label: "Health is not failed",
      severity: "hard",
      status: measurement.health.status === "failed" ? "fail" : "pass",
      value: measurement.health.status,
      threshold: "status !== failed",
      message: measurement.health.status === "failed"
        ? measurement.health.messages.join("; ") || "Simulation health failed."
        : "Simulation health is acceptable for verification.",
    },
    {
      id: "left-right-forward-co-balance",
      label: "Left/right forward CO balance",
      severity: "hard",
      status: measurement.forwardCODiffLMin < 0.5 ? "pass" : "fail",
      value: measurement.forwardCODiffLMin,
      threshold: "< 0.5 L/min",
      score: scoreBelow(measurement.forwardCODiffLMin, 0.1, 0.5),
      message: "Forward left and right output should be balanced after settling.",
    },
    {
      id: "projector-quiet",
      label: "TBV projector quiet during measurement",
      severity: "hard",
      status: measurement.projectorQuiet ? "pass" : "fail",
      value: measurement.venousBalances.maxResidualMl,
      threshold: "venous residual < 0.05 mL and correction quiet",
      message: measurement.projectorQuiet
        ? "TBV correction stayed quiet during the beat window."
        : "TBV correction or venous residual remained active during measurement.",
    },
  ];
}

export function collectNormalBaselineGates(measurement: SteadyMeasurement): GateResult[] {
  const beat = lastCompleteBeat(measurement.samples);
  if (beat.length === 0) {
    return [{
      id: "last-complete-beat",
      label: "Last complete beat available",
      severity: "hard",
      status: "fail",
      message: "No complete beat was available for morphology gates.",
    }];
  }

  const m = measurement.metrics;
  const core = measurement.core;
  const lvpPeak = Math.max(...beat.map((s) => s.LVP));
  const aopPeak = Math.max(...beat.map((s) => s.AoP));
  const lvpMin = Math.min(...beat.map((s) => s.LVP));
  const qmv = atrioventricularInflowShape(beat, "QMV");
  const qtv = atrioventricularInflowShape(beat, "QTV");
  const pvf = pulmonaryVenousShape(beat);
  const la = atrialLoopShape(beat, "LA");
  const ra = atrialLoopShape(beat, "RA");
  const elv = elastanceShape(beat, "LV");
  const mvAll = transmitralGradientStats(beat, 0, 1);
  const mvE = transmitralGradientStats(beat, 0.30, 0.75);
  const mvA = transmitralGradientStats(beat, 0.85, 0.08);
  const rvPreEdp = preSystolicRvEdp(beat);
  const [rvMin, rvMax] = rangeOf(beat, "VRV");
  const [raMin, raMax] = rangeOf(beat, "VRA");
  const [, rvpMax] = rangeOf(beat, "RVP");

  return [
    hardRange("aop-mean", "Mean aortic pressure", m.AoPMean, 80, 100, "mmHg"),
    hardRange("aop-systolic", "Aortic systolic pressure", m.AoPSys, 0, 130, "mmHg"),
    hardRange("aop-diastolic", "Aortic diastolic pressure", m.AoPDia, 0, 85, "mmHg"),
    hardRange("co-left", "Left cardiac output", m.CO_L, 4, 7, "L/min"),
    hardRange("pap-mean", "Mean pulmonary artery pressure", m.PAPMean, 14, 22, "mmHg"),
    hardRange("rap-mean", "Mean right atrial pressure", m.RAPMean, 2, 5, "mmHg"),
    hardRange("lap-mean", "Mean left atrial pressure", m.LAPMean, 6, 12, "mmHg"),
    hardRange("lvedp", "LVEDP approximation", m.LVEDPApprox, 8, 14, "mmHg"),
    hardRange("ef-left", "Left EF approximation", m.EF_LApprox, 0.53, 0.75, ""),
    hardRange("ef-right", "Right EF approximation", m.EF_RApprox, 0.50, 0.75, ""),
    {
      id: "lvp-aop-peak-gap",
      label: "LVP/AoP peak gap",
      severity: "hard",
      status: Math.abs(lvpPeak - aopPeak) < 8 ? "pass" : "fail",
      value: Math.abs(lvpPeak - aopPeak),
      threshold: "< 8 mmHg",
      score: scoreBelow(Math.abs(lvpPeak - aopPeak), 4, 8),
      message: "Normal baseline should not look AS-like.",
    },
    {
      id: "lvp-diastolic-min",
      label: "Beat minimum LVP",
      severity: "hard",
      status: lvpMin > 3 && lvpMin < 8 ? "pass" : "fail",
      value: lvpMin,
      threshold: "3-8 mmHg",
      score: scoreRange(lvpMin, 3, 8),
      message: "LVP should avoid excessive suction/floor artifacts in the normal baseline.",
    },
    {
      id: "lv-pressure-floor",
      label: "LV pressure floor not used",
      severity: "hard",
      status: beat.reduce((acc, s) => acc + s.LVPressureFloorHit01, 0) === 0 ? "pass" : "fail",
      value: beat.reduce((acc, s) => acc + s.LVPressureFloorHit01, 0),
      threshold: "sum === 0",
      message: "Normal LV diastole should be supported by passive mechanics rather than pressure-floor clamps.",
    },
    passiveGate(core, "lv-passive-p60", "LV passive P(60 mL)", "LV", 60, 0, 2),
    passiveGate(core, "lv-passive-p100", "LV passive P(100 mL)", "LV", 100, 2, 6),
    passiveGate(core, "lv-passive-p120", "LV passive P(120 mL)", "LV", 120, 8, 12),
    passiveGate(core, "lv-passive-p140", "LV passive P(140 mL)", "LV", 140, 18, 28),
    passiveGate(core, "rv-passive-p100", "RV passive P(100 mL)", "RV", 100, 0.5, 2.0),
    passiveGate(core, "rv-passive-p150", "RV passive P(150 mL)", "RV", 150, 3.5, 7.0),
    passiveGate(core, "rv-passive-p190", "RV passive P(190 mL)", "RV", 190, 7.0, 13.0),
    regurgitationGate(beat, "QMV", 0.005),
    regurgitationGate(beat, "QAo", 0.001),
    regurgitationGate(beat, "QTV", 0.005),
    regurgitationGate(beat, "QPV", 0.001),
    {
      id: "qmv-biphasic",
      label: "Mitral inflow E/A biphasic",
      severity: "hard",
      status: qmv.ePeak && qmv.aPeak && qmv.ePeak.value > 100 && qmv.aPeak.value > 80 && (qmv.aOverE ?? 0) > 0.35 ? "pass" : "fail",
      value: qmv.aOverE,
      threshold: "E > 100, A > 80, A/E > 0.35",
      score: qmv.aOverE == null ? 0 : scoreAbove(qmv.aOverE, 0.35, 0.7),
      message: "Normal mitral inflow should show readable E and A waves.",
    },
    {
      id: "qtv-biphasic",
      label: "Tricuspid inflow E/A biphasic",
      severity: "hard",
      status: qtv.ePeak && qtv.aPeak && qtv.ePeak.value > 100 && qtv.aPeak.value > 80 && (qtv.aOverE ?? 0) > 0.35 ? "pass" : "fail",
      value: qtv.aOverE,
      threshold: "E > 100, A > 80, A/E > 0.35",
      score: qtv.aOverE == null ? 0 : scoreAbove(qtv.aOverE, 0.35, 0.7),
      message: "Normal tricuspid inflow should show readable E and A waves.",
    },
    {
      id: "la-figure-eight",
      label: "LA figure-eight PV loop",
      severity: "hard",
      status: la.selfIntersections >= 1 && la.absArea > 20 && la.midVolumePressureSpread > 1.5 ? "pass" : "fail",
      value: la.selfIntersections,
      threshold: "intersection >= 1, area > 20, mid spread > 1.5",
      message: "LA loop should preserve reservoir and booster-loop morphology.",
    },
    {
      id: "ra-figure-eight",
      label: "RA figure-eight PV loop",
      severity: "hard",
      status: ra.selfIntersections >= 1 && ra.absArea > 30 && ra.midVolumePressureSpread > 2 ? "pass" : "fail",
      value: ra.selfIntersections,
      threshold: "intersection >= 1, area > 30, mid spread > 2",
      message: "RA loop should preserve reservoir and booster-loop morphology.",
    },
    {
      id: "pvf-readable",
      label: "Pulmonary venous S/D/Ar morphology",
      severity: "hard",
      status: pvf.sPeak != null && pvf.dPeak != null && pvf.arTrough != null &&
        phaseInWindow(pvf.arTrough.theta, 0.84, 0.98) &&
        (pvf.sFraction ?? 0) > 0.40 &&
        (pvf.sOverD ?? 0) > 0.50 &&
        (pvf.reverseFraction ?? 1) < 0.055 ? "pass" : "fail",
      value: `Sfrac=${format(pvf.sFraction)} S/D=${format(pvf.sOverD)} rev=${format(pvf.reverseFraction)} ArTheta=${format(pvf.arTrough?.theta)}`,
      threshold: "S fraction > 0.40, S/D > 0.50, reverse/forward < 0.055, Ar theta 0.84-0.98",
      score: pvf.sFraction == null ? 0 : scoreAbove(pvf.sFraction, 0.40, 0.55),
      message: "PVF should expose S/D/Ar without shifting into high-backflow morphology.",
    },
    {
      id: "mv-gradient",
      label: "Normal transmitral gradients",
      severity: "hard",
      status: mvAll.n > 20 && mvAll.mean < 3 && mvE.mean < 4 && mvE.peak < 7 && mvA.mean < 3 && mvA.peak < 6 ? "pass" : "fail",
      value: `allMean=${format(mvAll.mean)} eMean=${format(mvE.mean)} ePeak=${format(mvE.peak)} aMean=${format(mvA.mean)} aPeak=${format(mvA.peak)}`,
      threshold: "all mean < 3, E mean < 4, E peak < 7, A mean < 3, A peak < 6 mmHg",
      score: scoreBelow(mvAll.mean, 2, 3),
      message: "Competent normal MV should not present as MS-like.",
    },
    {
      id: "right-heart",
      label: "Right-heart baseline physiology",
      severity: "hard",
      status: rvPreEdp > 2 && rvPreEdp < 8 && (rvMax - rvMin) / rvMax > 0.50 && rvpMax < 45 &&
        raMax < 85 && raMin > 25 && (raMax - raMin) / raMax > 0.44 ? "pass" : "fail",
      value: rvPreEdp,
      threshold: "RVEDP 2-8, RV stroke fraction >0.50, RVP max <45",
      score: scoreRange(rvPreEdp, 2, 8),
      message: "Right-heart pressure and volume ranges should stay normal at baseline.",
    },
    {
      id: "lv-active-elastance-shape",
      label: "LV apparent elastance shape",
      severity: "soft",
      status: elv.activeHalfMaxDurationSec > 0.12 && elv.activeMin > 0.035 ? "pass" : "fail",
      value: elv.activeHalfMaxDurationSec,
      threshold: "half-max > 0.12 s, min > 0.035",
      score: scoreAbove(elv.activeHalfMaxDurationSec, 0.12, 0.18),
      message: "Active apparent elastance should not be an overly sharp impulse.",
    },
  ];
}

export function baselineShapeSummary(measurement: SteadyMeasurement): BaselineShapeSummary {
  const beat = lastCompleteBeat(measurement.samples);
  const lvpPeak = Math.max(...beat.map((s) => s.LVP));
  const aopPeak = Math.max(...beat.map((s) => s.AoP));
  const qmv = atrioventricularInflowShape(beat, "QMV");
  const qtv = atrioventricularInflowShape(beat, "QTV");
  const pvf = pulmonaryVenousShape(beat);
  const la = atrialLoopShape(beat, "LA");
  const ra = atrialLoopShape(beat, "RA");
  const elv = elastanceShape(beat, "LV");
  return {
    lvpPeak,
    aopPeak,
    lvpAopPeakGap: Math.abs(lvpPeak - aopPeak),
    lvpMin: Math.min(...beat.map((s) => s.LVP)),
    qmvAOverE: qmv.aOverE,
    qtvAOverE: qtv.aOverE,
    pvfSFraction: pvf.sFraction,
    pvfSOverD: pvf.sOverD,
    pvfReverseFraction: pvf.reverseFraction,
    laSelfIntersections: la.selfIntersections,
    raSelfIntersections: ra.selfIntersections,
    lvActiveElastanceHalfMaxSec: elv.activeHalfMaxDurationSec,
    rvPreSystolicEdp: preSystolicRvEdp(beat),
  };
}

function hardRange(
  id: string,
  label: string,
  value: number,
  lo: number,
  hi: number,
  unit: string,
): GateResult {
  const pass = value > lo && value < hi;
  return {
    id,
    label,
    severity: "hard",
    status: pass ? "pass" : "fail",
    value,
    threshold: `${lo} < value < ${hi}${unit ? ` ${unit}` : ""}`,
    score: scoreRange(value, lo, hi),
    message: pass ? `${label} is inside the normal baseline corridor.` : `${label} is outside the normal baseline corridor.`,
  };
}

function passiveGate(
  core: ModelCore,
  id: string,
  label: string,
  chamber: "LV" | "RV",
  volumeMl: number,
  lo: number,
  hi: number,
): GateResult {
  const value = core.passivePressureAt(chamber, volumeMl);
  return hardRange(id, label, value, lo, hi, "mmHg");
}

function regurgitationGate(samples: SimSample[], key: "QMV" | "QAo" | "QTV" | "QPV", limit: number): GateResult {
  const value = regurgitantFraction(samples, key);
  return {
    id: `regurg-${key}`,
    label: `${key} regurgitant fraction`,
    severity: "hard",
    status: value < limit ? "pass" : "fail",
    value,
    threshold: `< ${limit}`,
    score: scoreBelow(value, limit * 0.5, limit),
    message: "Normal baseline valves should have negligible regurgitation.",
  };
}

function scoreRange(value: number, lo: number, hi: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value > lo && value < hi) return 1;
  const span = Math.max(hi - lo, 1e-9);
  const distance = value <= lo ? lo - value : value - hi;
  return Math.max(0, 1 - distance / span);
}

function scoreBelow(value: number, ideal: number, limit: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value <= ideal) return 1;
  if (value >= limit) return 0;
  return 1 - (value - ideal) / Math.max(limit - ideal, 1e-9);
}

function scoreAbove(value: number, limit: number, ideal: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value >= ideal) return 1;
  if (value <= limit) return 0;
  return (value - limit) / Math.max(ideal - limit, 1e-9);
}

function format(value: number | null | undefined): string {
  return value == null ? "n/a" : value.toPrecision(4);
}
