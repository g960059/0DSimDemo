import { defaultParams } from "@/engine/ModelCore";
import type { SteadyMeasurement } from "@/engine/measure";
import type { ModelCoreRuntimeActiveSourceMode } from "@/engine/myocardium/runtimeActiveSource";
import type { CoreRuntimeParams, SimMetrics } from "@/engine/protocol";
import { runToPeriodicSteadyInternal } from "@/engine/steadyJob";
import type { SolverStats, SteadyResiduals, SteadyResult, SteadyStatus } from "@/engine/stateContract";
import {
  morphologyCheckSummaryFromSamples,
  type MorphologyCheckSummary,
} from "@/engine/verification/morphologyCheck";
import { panelForGate, type VerificationArtifactFile } from "@/engine/verification/panels";
import type { SettleStatus } from "@/engine/settling";
import {
  baselineShapeSummary,
  collectNormalBaselineGates,
  collectValidityGates,
  settleGate,
  summarizeGates,
  type BaselineShapeSummary,
  type GateResult,
  type VerificationSummary,
} from "@/engine/verification/gates";
import {
  resolveVerificationProfile,
  type VerificationMode,
  type VerificationProfile,
} from "@/engine/verification/profiles";

export type VerificationGateSet = "validityOnly" | "normalBaseline";

export type VerificationReport = {
  profile: VerificationProfile;
  gateSet: VerificationGateSet;
  runtimeActiveSourceMode: ModelCoreRuntimeActiveSourceMode | null;
  generatedAt: string;
  summary: VerificationSummary;
  steady: VerificationSteadySummary | null;
  settleStatus: SettleStatus | null;
  metrics: SimMetrics | null;
  shape: BaselineShapeSummary | null;
  morphology: MorphologyCheckSummary | null;
  gates: GateResult[];
  failureLocations: FailureLocation[];
  measurement: SteadyMeasurement | null;
};

export type VerificationSteadyStateMetadata = {
  schemaVersion: SteadyResult["state"]["schemaVersion"];
  modelVersion: SteadyResult["state"]["modelVersion"];
  stateLayoutHash: string;
  paramsHash: string;
  targetParamsHash: string;
  t: number;
  phi: number;
  xLength: number;
};

export type VerificationSteadySummary = {
  status: SteadyStatus;
  ok: boolean;
  residuals: SteadyResiduals;
  solverStats: SolverStats;
  state: VerificationSteadyStateMetadata;
};

export type FailureLocation = {
  gateId: string;
  severity: GateResult["severity"];
  artifactFile: VerificationArtifactFile;
  panelId: string;
  panelTitle: string;
  value?: GateResult["value"];
  threshold?: string;
};

export type VerificationArtifact = Omit<VerificationReport, "measurement"> & {
  measurement: null;
};

export type VerificationRunOptions = {
  profile?: VerificationMode | VerificationProfile;
  gateSet?: VerificationGateSet;
  runtimeActiveSourceMode?: ModelCoreRuntimeActiveSourceMode;
  now?: Date;
};

export function runVerification(
  params: Partial<CoreRuntimeParams> = defaultParams(),
  options: VerificationRunOptions = {},
): VerificationReport {
  const profile = resolveVerificationProfile(options.profile ?? "verifyAccurate");
  const gateSet = options.gateSet ?? "validityOnly";
  const measureOptions = {
    targetTBV: profile.targetTBV,
    dt: profile.dt,
    sampleHz: profile.sampleHz,
    settlePolicy: profile.settlePolicy,
    measureBeats: profile.measureBeats,
    requireProjectorQuiet: profile.requireProjectorQuiet,
    ...(options.runtimeActiveSourceMode ? { runtimeActiveSourceMode: options.runtimeActiveSourceMode } : {}),
  };
  const steadyRun = runToPeriodicSteadyInternal(params, measureOptions);
  const steady = summarizeSteady(steadyRun.result);
  const settled = steadyRun.settleStatus;
  const measurement = steadyRun.measurement;

  if (!measurement || !settled.settled) {
    const gates = [settleGate(settled)];
    return {
      profile,
      gateSet,
      runtimeActiveSourceMode: options.runtimeActiveSourceMode ?? null,
      generatedAt: (options.now ?? new Date()).toISOString(),
      summary: summarizeGates(gates),
      steady,
      settleStatus: settled,
      metrics: null,
      shape: null,
      morphology: null,
      gates,
      failureLocations: failureLocations(gates),
      measurement: null,
    };
  }

  const gates = adjustGatesForProfile([
    settleGate(measurement.settleStatus),
    ...collectValidityGates(measurement).filter((gate) => {
      return profile.requireProjectorQuiet || gate.id !== "projector-quiet";
    }),
    ...(gateSet === "normalBaseline" ? collectNormalBaselineGates(measurement) : []),
  ], profile);

  return {
    profile,
    gateSet,
    runtimeActiveSourceMode: options.runtimeActiveSourceMode ?? null,
    generatedAt: (options.now ?? new Date()).toISOString(),
    summary: summarizeGates(gates),
    steady,
    settleStatus: measurement.settleStatus,
    metrics: measurement.metrics,
    shape: gateSet === "normalBaseline" ? baselineShapeSummary(measurement) : null,
    morphology: gateSet === "normalBaseline" ? morphologyCheckSummaryFromSamples(measurement.samples) : null,
    gates,
    failureLocations: failureLocations(gates),
    measurement,
  };
}

function adjustGatesForProfile(gates: GateResult[], profile: VerificationProfile): GateResult[] {
  if (profile.mode === "verifyAccurate") return gates;
  const triageSoftIds = new Set([
    "lv-active-elastance-shape",
  ]);
  return gates.map((gate) => {
    const triageSoft =
      triageSoftIds.has(gate.id) ||
      gate.id.startsWith("pvf-") ||
      gate.id.startsWith("mv-gradient-");
    if (!triageSoft) return gate;
    return {
      ...gate,
      severity: "soft" as const,
      message: `${gate.message} Triage profile records this as score-only; verifyAccurate enforces it as a hard gate.`,
    };
  });
}

export function reportToMarkdown(report: VerificationReport): string {
  const lines: string[] = [];
  lines.push(`# Verification Report`);
  lines.push("");
  lines.push(`- Profile: ${report.profile.label} (${report.profile.mode})`);
  lines.push(`- Gate set: ${report.gateSet}`);
  lines.push(`- Runtime active-source mode: ${report.runtimeActiveSourceMode ?? "baseline-default"}`);
  lines.push(`- Generated: ${report.generatedAt}`);
  lines.push(`- Pass: ${report.summary.pass ? "yes" : "no"}`);
  lines.push(`- Hard failures: ${report.summary.hardFailures}`);
  lines.push(`- Soft failures: ${report.summary.softFailures}`);
  lines.push(`- Score: ${round(report.summary.score, 3)}`);
  if (report.failureLocations.length > 0) {
    lines.push("");
    lines.push("## Failure Localization");
    lines.push("");
    for (const loc of report.failureLocations) {
      const value = loc.value === undefined ? "" : ` value=${String(loc.value)}`;
      const threshold = loc.threshold ? ` threshold=${loc.threshold}` : "";
      lines.push(`- ${loc.gateId} -> ${loc.artifactFile}#${loc.panelId} (${loc.panelTitle})${value}${threshold}`);
    }
  }
  if (report.metrics) {
    lines.push("");
    lines.push("## Metrics");
    lines.push("");
    lines.push(`- AoP: ${round(report.metrics.AoPSys, 1)}/${round(report.metrics.AoPDia, 1)} (mean ${round(report.metrics.AoPMean, 1)}) mmHg`);
    lines.push(`- CO: L ${round(report.metrics.CO_L, 2)} / R ${round(report.metrics.CO_R, 2)} L/min`);
    lines.push(`- EF: L ${round(report.metrics.EF_LApprox, 2)} / R ${round(report.metrics.EF_RApprox, 2)}`);
    lines.push(`- Filling pressures: LAP ${round(report.metrics.LAPMean, 1)}, RAP ${round(report.metrics.RAPMean, 1)}, LVEDP ${round(report.metrics.LVEDPApprox, 1)} mmHg`);
    lines.push(`- PAP mean: ${round(report.metrics.PAPMean, 1)} mmHg`);
  }
  if (report.shape) {
    lines.push("");
    lines.push("## Shape");
    lines.push("");
    lines.push(`- LVP/AoP peak gap: ${round(report.shape.lvpAopPeakGap, 2)} mmHg`);
    lines.push(`- QMV A/E: ${nullableRound(report.shape.qmvAOverE, 3)}`);
    lines.push(`- QTV A/E: ${nullableRound(report.shape.qtvAOverE, 3)}`);
    lines.push(`- PVF S fraction: ${nullableRound(report.shape.pvfSFraction, 3)}`);
    lines.push(`- PVF S/D: ${nullableRound(report.shape.pvfSOverD, 3)}`);
    lines.push(`- PVF reverse fraction: ${nullableRound(report.shape.pvfReverseFraction, 3)}`);
    lines.push(`- LA/RA loop intersections: ${report.shape.laSelfIntersections}/${report.shape.raSelfIntersections}`);
  }
  if (report.morphology) {
    lines.push("");
    lines.push("## Morphology Check");
    lines.push("");
    lines.push(`- Version: ${report.morphology.version}`);
    lines.push(`- Profile: ${report.morphology.morphologyProfileId}`);
    lines.push(`- Overall: ${report.morphology.status}`);
    lines.push(`- Beat samples: ${report.morphology.checkedBeatSampleCount}`);
    lines.push(`- Badges: LV PV ${report.morphology.badges.lvPv}, RV PV ${report.morphology.badges.rvPv}, LA PV ${report.morphology.badges.laPv}, RA PV ${report.morphology.badges.raPv}, MVF ${report.morphology.badges.mvf}, TVF ${report.morphology.badges.tvf}, LAP ${report.morphology.badges.lapWaveform}, RAP ${report.morphology.badges.rapWaveform}`);
    for (const result of report.morphology.results) {
      lines.push(`- ${result.status.toUpperCase()} ${result.label}: ${result.message} value=${String(result.value)} threshold=${result.threshold}`);
    }
  }
  if (report.steady) {
    const { residuals, solverStats, state } = report.steady;
    lines.push("");
    lines.push("## Steady State");
    lines.push("");
    lines.push(`- Solver: ${solverStats.kind}; dt ${solverStats.dt}; sampleHz ${solverStats.sampleHz}`);
    lines.push(`- Window: settle ${round(solverStats.settleSeconds, 3)} s; measure ${round(solverStats.measureSeconds, 3)} s; settle beats ${solverStats.nBeats ?? "n/a"}`);
    lines.push(`- Status: ${report.steady.status}; ok ${report.steady.ok ? "yes" : "no"}`);
    lines.push(`- Worst residual: ${residuals.worstSignal ?? "none"}; delta ${nullableRound(residuals.worstDelta, 6)}`);
    lines.push(`- Left-right mismatch: ${round(residuals.leftRightSvMismatchLMin, 4)} L/min (${round(residuals.leftRightSvMismatchPct, 3)}%)`);
    lines.push(`- TBV drift: ${nullableRound(residuals.tbvDriftPctPer60s, 6)}% per 60s`);
    lines.push(`- Projector quiet: ${residuals.projectorQuiet ? "yes" : "no"}`);
    lines.push(`- Params hash: ${state.paramsHash}; target ${state.targetParamsHash}`);
    lines.push(`- State layout hash: ${state.stateLayoutHash}`);
  }
  lines.push("");
  lines.push("## Gates");
  lines.push("");
  for (const gate of report.gates) {
    const icon = gate.status === "pass" ? "PASS" : "FAIL";
    const value = gate.value === undefined ? "" : ` value=${String(gate.value)}`;
    const threshold = gate.threshold ? ` threshold=${gate.threshold}` : "";
    lines.push(`- ${icon} [${gate.severity}] ${gate.id}: ${gate.message}${value}${threshold}`);
  }
  return `${lines.join("\n")}\n`;
}

function failureLocations(gates: GateResult[]): FailureLocation[] {
  return gates
    .filter((gate) => gate.status === "fail")
    .map((gate) => {
      const panel = panelForGate(gate.id);
      return {
        gateId: gate.id,
        severity: gate.severity,
        artifactFile: panel?.artifactFile ?? "report.md",
        panelId: panel?.id ?? "gates",
        panelTitle: panel?.title ?? "Gates",
        value: gate.value,
        threshold: gate.threshold,
      };
    });
}

export function toVerificationArtifact(report: VerificationReport): VerificationArtifact {
  return {
    ...report,
    measurement: null,
  };
}

function summarizeSteady(result: SteadyResult): VerificationSteadySummary {
  return {
    status: result.status,
    ok: result.ok,
    residuals: result.residuals,
    solverStats: result.solverStats,
    state: {
      schemaVersion: result.state.schemaVersion,
      modelVersion: result.state.modelVersion,
      stateLayoutHash: result.state.stateLayoutHash,
      paramsHash: result.state.paramsHash,
      targetParamsHash: result.state.targetParamsHash,
      t: result.state.t,
      phi: result.state.phi,
      xLength: result.state.x.length,
    },
  };
}

function round(value: number, dp: number): number {
  const f = 10 ** dp;
  return Math.round(value * f) / f;
}

function nullableRound(value: number | null, dp: number): string {
  return value == null ? "n/a" : String(round(value, dp));
}
