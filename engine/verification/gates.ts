import type { ModelCore } from "@/engine/ModelCore";
import type { SteadyMeasurement } from "@/engine/measure";
import type { SimSample } from "@/engine/protocol";
import type { SettleStatus } from "@/engine/settling";
import {
  atrialLoopShape,
  atrioventricularInflowShape,
  elastanceShape,
  lastCompleteBeat,
  leftFillingRingingShape,
  phaseInWindow,
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

const PVF_AR_WINDOW: [number, number] = [0.84, 0.98];

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
  const leftFilling = leftFillingRingingShape(beat);
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
  const rvStrokeFraction = rvMax > 1e-9 ? (rvMax - rvMin) / rvMax : NaN;
  const raEmptyingFraction = raMax > 1e-9 ? (raMax - raMin) / raMax : NaN;

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
    peakGate("qmv-e-peak", "Mitral E-wave peak", qmv.ePeak?.value ?? null, 100, "mL/s"),
    peakGate("qmv-a-peak", "Mitral A-wave peak", qmv.aPeak?.value ?? null, 80, "mL/s"),
    ratioGate("qmv-a-over-e", "Mitral A/E ratio", qmv.aOverE, 0.35, 0.70),
    upperBoundGate("qmv-extra-peaks", "Mitral inflow extra peaks", leftFilling.qmvExtraPeakCount, 0.5, 0),
    upperBoundGate("lap-oscillation-index", "LAP oscillation index", leftFilling.lapOscillationIndex, 4.2, 2.8),
    upperBoundGate("lap-prominent-extrema", "LAP prominent extrema count", leftFilling.lapProminentPeakCount + leftFilling.lapProminentTroughCount, 5.5, 3),
    upperBoundGate("lv-filling-edge-roughness", "LV filling-edge roughness", leftFilling.lvFillingEdgeRoughness, 2.6, 1.6),
    upperBoundGate("lv-filling-edge-curvature", "LV filling-edge curvature", leftFilling.lvFillingEdgeCurvature, 2.4, 1.4),
    upperBoundGate("lv-filling-edge-reversals", "LV filling-edge pressure reversals", leftFilling.lvFillingEdgeReversalCount, 1.5, 1),
    peakGate("qtv-e-peak", "Tricuspid E-wave peak", qtv.ePeak?.value ?? null, 100, "mL/s"),
    peakGate("qtv-a-peak", "Tricuspid A-wave peak", qtv.aPeak?.value ?? null, 80, "mL/s"),
    ratioGate("qtv-a-over-e", "Tricuspid A/E ratio", qtv.aOverE, 0.35, 0.70),
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
    peakGate("pvf-s-peak", "Pulmonary venous S wave", pvf.sPeak?.value ?? null, 120, "mL/s"),
    peakGate("pvf-d-peak", "Pulmonary venous D wave", pvf.dPeak?.value ?? null, 180, "mL/s"),
    {
      id: "pvf-ar-present",
      label: "Pulmonary venous Ar reversal",
      severity: "hard",
      status: pvf.arTrough != null &&
        phaseInWindow(pvf.arTrough.theta, PVF_AR_WINDOW[0], PVF_AR_WINDOW[1]) &&
        pvf.arTrough.value < 0 ? "pass" : "fail",
      value: `Ar=${format(pvf.arTrough?.value)} theta=${format(pvf.arTrough?.theta)}`,
      threshold: "Ar < 0 in theta 0.84-0.98",
      score: pvf.arTrough?.value == null ? 0 : scoreBelow(pvf.arTrough.value, -20, 0),
      message: "PVF should include true retrograde atrial reversal, not merely a low positive forward flow.",
    },
    ratioGate("pvf-s-fraction", "PVF systolic filling fraction", pvf.sFraction, 0.40, 0.55),
    ratioGate("pvf-s-over-d", "PVF S/D forward-volume ratio", pvf.sOverD, 0.50, 0.90),
    upperBoundGate("pvf-reverse-fraction", "PVF reverse/forward fraction", pvf.reverseFraction, 0.055, 0.03),
    countGate("mv-gradient-forward-count", "Transmitral forward-gradient samples", mvAll.n, 20),
    upperBoundGate("mv-gradient-all-mean", "Transmitral mean gradient", mvAll.mean, 3, 2),
    upperBoundGate("mv-gradient-e-mean", "Transmitral E-wave mean gradient", mvE.mean, 4, 3),
    upperBoundGate("mv-gradient-e-peak", "Transmitral E-wave peak gradient", mvE.peak, 6.3, 5),
    upperBoundGate("mv-gradient-a-mean", "Transmitral A-wave mean gradient", mvA.mean, 3, 2),
    upperBoundGate("mv-gradient-a-peak", "Transmitral A-wave peak gradient", mvA.peak, 6, 4),
    hardRange("rv-edp-presystolic", "Pre-systolic RVEDP", rvPreEdp, 2, 8, "mmHg"),
    ratioGate("rv-stroke-fraction", "RV stroke fraction", rvStrokeFraction, 0.50, 0.58),
    upperBoundGate("rvp-max", "RVP maximum", rvpMax, 45, 35),
    upperBoundGate("ra-volume-max", "RA maximum volume", raMax, 85, 70),
    lowerBoundGate("ra-volume-min", "RA minimum volume", raMin, 25, 35),
    ratioGate("ra-emptying-fraction", "RA emptying fraction", raEmptyingFraction, 0.44, 0.55),
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
  if (beat.length === 0) {
    return {
      lvpPeak: NaN,
      aopPeak: NaN,
      lvpAopPeakGap: NaN,
      lvpMin: NaN,
      qmvAOverE: null,
      qtvAOverE: null,
      pvfSFraction: null,
      pvfSOverD: null,
      pvfReverseFraction: null,
      laSelfIntersections: 0,
      raSelfIntersections: 0,
      lvActiveElastanceHalfMaxSec: NaN,
      rvPreSystolicEdp: NaN,
    };
  }
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

function peakGate(id: string, label: string, value: number | null, min: number, unit: string): GateResult {
  const pass = value != null && value > min;
  return {
    id,
    label,
    severity: "hard",
    status: pass ? "pass" : "fail",
    value,
    threshold: `> ${min} ${unit}`,
    score: value == null ? 0 : scoreAbove(value, min, min * 1.5),
    message: pass ? `${label} is readable.` : `${label} is absent or too small for normal-baseline morphology.`,
  };
}

function ratioGate(id: string, label: string, value: number | null, min: number, ideal: number): GateResult {
  const pass = value != null && value > min;
  return {
    id,
    label,
    severity: "hard",
    status: pass ? "pass" : "fail",
    value,
    threshold: `> ${min}`,
    score: value == null ? 0 : scoreAbove(value, min, ideal),
    message: pass ? `${label} is inside the readable morphology corridor.` : `${label} is below the morphology threshold.`,
  };
}

function countGate(id: string, label: string, value: number, min: number): GateResult {
  const pass = value > min;
  return {
    id,
    label,
    severity: "hard",
    status: pass ? "pass" : "fail",
    value,
    threshold: `> ${min}`,
    score: scoreAbove(value, min, min * 1.5),
    message: pass ? `${label} is sufficient for stable gradient statistics.` : `${label} is too sparse for gradient statistics.`,
  };
}

function upperBoundGate(id: string, label: string, value: number | null, limit: number, ideal: number): GateResult {
  const pass = value != null && value < limit;
  return {
    id,
    label,
    severity: "hard",
    status: pass ? "pass" : "fail",
    value,
    threshold: `< ${limit}`,
    score: value == null ? 0 : scoreBelow(value, ideal, limit),
    message: pass ? `${label} is below the normal-baseline upper bound.` : `${label} exceeds the normal-baseline upper bound.`,
  };
}

function lowerBoundGate(id: string, label: string, value: number | null, min: number, ideal: number): GateResult {
  const pass = value != null && value > min;
  return {
    id,
    label,
    severity: "hard",
    status: pass ? "pass" : "fail",
    value,
    threshold: `> ${min}`,
    score: value == null ? 0 : scoreAbove(value, min, ideal),
    message: pass ? `${label} is above the normal-baseline lower bound.` : `${label} is below the normal-baseline lower bound.`,
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
